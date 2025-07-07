# app.py
from flask import Flask
from flask_cors import CORS

from routes.clientes import clientes_bp
from routes.productos import productos_bp
from routes.pedidos import pedidos_bp
from routes.proveedores import proveedores_bp

app = Flask(__name__)
CORS(app)

# Registrar los blueprints (rutas)
app.register_blueprint(clientes_bp, url_prefix='/api/clientes')
app.register_blueprint(productos_bp, url_prefix='/api/productos')
app.register_blueprint(pedidos_bp, url_prefix='/api/pedidos')
app.register_blueprint(proveedores_bp, url_prefix='/api/proveedores')

if __name__ == '__main__':
    app.run(debug=True)
