from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Flask is working!"

if __name__ == "__main__":
    app.run(debug=True, port=5001)  # Change to a different port, e.g., 5001
