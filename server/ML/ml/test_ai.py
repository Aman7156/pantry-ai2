import pandas as pd
import ast
import pickle
import os

from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.neighbors import NearestNeighbors

# --- PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(current_dir, '..', 'recipes.csv')
csv_path = os.path.abspath(csv_path)

print("Loading dataset from:", csv_path)

# --- LOAD DATA ---
df = pd.read_csv(csv_path, nrows=5000)

# --- CLEAN DATA ---
df = df[['name', 'ingredients', 'steps', 'minutes', 'nutrition']]

df['title'] = df['name'].fillna('Untitled')

# --- NORMALIZATION FUNCTION (VERY IMPORTANT) ---
def normalize(word):
    word = word.lower().strip()
    
    # remove extra spaces
    word = word.replace("-", " ")
    
    # simple plural handling
    if word.endswith('s') and len(word) > 3:
        word = word[:-1]
    
    return word

# --- PARSE INGREDIENTS ---
def parse_ingredients(x):
    try:
        ingredients = ast.literal_eval(x)
        return [normalize(i) for i in ingredients]
    except:
        return []

df['ingredients_list'] = df['ingredients'].apply(parse_ingredients)

# --- REMOVE EMPTY ROWS ---
df = df[df['ingredients_list'].map(len) > 0]

print("Total recipes after cleaning:", len(df))

# --- TRAIN MODEL ---
mlb = MultiLabelBinarizer(sparse_output=True)
X = mlb.fit_transform(df['ingredients_list'])

model = NearestNeighbors(metric='cosine', algorithm='brute')
model.fit(X)

# --- SAVE MODEL ---
model_dir = os.path.join(current_dir, 'model')
os.makedirs(model_dir, exist_ok=True)

pickle.dump(model, open(os.path.join(model_dir, 'model.pkl'), 'wb'))
pickle.dump(mlb, open(os.path.join(model_dir, 'mlb.pkl'), 'wb'))
df.to_pickle(os.path.join(model_dir, 'recipes.pkl'))

print("✅ Training complete. Model saved.")