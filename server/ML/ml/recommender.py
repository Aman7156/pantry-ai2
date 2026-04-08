import json
import pickle
import os
import ast

current_dir = os.path.dirname(os.path.abspath(__file__))

model = pickle.load(open(os.path.join(current_dir, 'model/model.pkl'), 'rb'))
mlb = pickle.load(open(os.path.join(current_dir, 'model/mlb.pkl'), 'rb'))
df = pickle.load(open(os.path.join(current_dir, 'model/recipes.pkl'), 'rb'))

OPTIONAL_INGREDIENTS = {
    "salt", "pepper", "oil", "olive oil",
    "cooking spray", "water", "butter"
}

def normalize(word):
    word = word.lower().strip()

    fixes = {
        "tomatoes": "tomato",
        "tomatoe": "tomato",
        "potatoes": "potato",
        "potatoe": "potato",
        "eggs": "egg",
        "bananas": "banana",
        "strawberries": "strawberry",
        "strawberrie": "strawberry",
        "berries": "berry"
    }

    if word in fixes:
        return fixes[word]

    if word.endswith('s') and len(word) > 3:
        word = word[:-1]

    return word


def clean_input(text):
    return list(set([normalize(i) for i in text.split(',') if i.strip()]))


def parse_nutrition(val):
    try:
        vals = ast.literal_eval(val)
        return {
            "calories": int(vals[0]),
            "fat": int(vals[1]),
            "protein": int(vals[4]),
            "carbs": int(vals[6])
        }
    except:
        return {"calories": 0, "fat": 0, "protein": 0, "carbs": 0}


def clean_instructions(val):
    try:
        return ast.literal_eval(val) if isinstance(val, str) else val
    except:
        return []


def score_recipe(recipe_ings, user_ings):
    recipe_set = set(recipe_ings)
    user_set = set(user_ings)

    used = recipe_set & user_set
    missing = [i for i in recipe_set - user_set if i not in OPTIONAL_INGREDIENTS]
    ignored = user_set - recipe_set

    if len(recipe_set) == 0 or len(user_set) == 0:
        return 0, [], [], 0

    recipe_match = len(used) / len(recipe_set)
    user_match = len(used) / len(user_set)

    score = (0.4 * recipe_match) + (0.6 * user_match)

    score -= len(missing) * 0.15
    score -= len(ignored) * 0.30

    score += len(used) * 0.05

    if len(missing) == 0:
        score += 0.3

    if len(used) == len(user_set):
        score += 0.3

    score = max(min(score, 1), 0)

    return score, list(used), missing, len(ignored)


# ✅ THIS IS THE FUNCTION FASTAPI WILL CALL
def get_recommendations(user_input: str):

    user_ingredients = clean_input(user_input)

    if not user_ingredients:
        return {
            "results": [],
            "message": "No ingredients provided"
        }

    user_vec = mlb.transform([user_ingredients])
    distances, indices = model.kneighbors(user_vec, n_neighbors=30)

    scored_results = []
    seen_titles = set()

    for i in indices[0]:
        row = df.iloc[i]
        title = str(row['title']).title()

        if title in seen_titles:
            continue
        seen_titles.add(title)

        recipe_ings = row['ingredients_list']

        match_score, used, missing, ignored_count = score_recipe(
            recipe_ings, user_ingredients
        )

        nutri = parse_nutrition(row.get('nutrition', '[]'))

        result = {
            "title": title,
            "ingredients": recipe_ings,
            "instructions": clean_instructions(row['steps']),
            "time": f"{int(row.get('minutes', 30))} min",
            "nutrition": {
                "calories": nutri['calories'],
                "protein": f"{nutri['protein']}g",
                "fat": f"{nutri['fat']}g",
                "carbs": f"{nutri['carbs']}g"
            },
            "matchScore": round(match_score, 2),
            "matchPercent": int(match_score * 100),
            "usedIngredients": used,
            "missingIngredients": missing,
            "missingCount": len(missing),
            "usedCount": len(used),
            "ignoredCount": ignored_count,
            "canCook": len(missing) == 0,
            "almostCookable": len(missing) <= 2
        }

        if result["canCook"]:
            result["status"] = "cookable"
        elif result["almostCookable"]:
            result["status"] = "almost"
        else:
            result["status"] = "hard"

        scored_results.append(result)

    filtered_results = [r for r in scored_results if r['matchScore'] > 0.25]

    if not filtered_results:
        filtered_results = sorted(scored_results, key=lambda x: x['matchScore'], reverse=True)

    scored_results = sorted(
        filtered_results,
        key=lambda x: (
            x['canCook'],
            x['almostCookable'],
            x['matchScore'],
            -x['missingCount'],
            -len(x['ingredients']),
            x['nutrition']['calories']
        ),
        reverse=True
    )

    return {"results": scored_results[:5]}