"""ArenaManager - servidor Flask.

Para rodar:  python app.py   (http://127.0.0.1:5000)
"""
from flask import Flask
from flask_cors import CORS

from database import close_db, init_db
from routes.api import api

app = Flask(__name__)
CORS(app)  # permite que o front-end (outro endereço) chame a API
app.register_blueprint(api)
app.teardown_appcontext(close_db)

init_db()

if __name__ == "__main__":
    app.run(debug=True)
