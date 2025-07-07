# routes/productos.py
from flask import Blueprint, jsonify, request
from bson import ObjectId
from db.connection import db

productos_bp = Blueprint('productos', __name__)
productos = db.productos

# Listar todos los productos
@productos_bp.route('/', methods=['GET'])
def listar_productos():
    resultado = []
    for producto in productos.find():
        producto['_id'] = str(producto['_id'])
        producto['proveedor_id'] = str(producto['proveedor_id']) if 'proveedor_id' in producto else None
        resultado.append(producto)
    return jsonify(resultado)

# Crear un nuevo producto
@productos_bp.route('/', methods=['POST'])
def crear_producto():
    data = request.json
    productos.insert_one(data)
    return jsonify({"mensaje": "Producto agregado correctamente"}), 201

# Actualizar un producto
@productos_bp.route('/<id>', methods=['PUT'])
def actualizar_producto(id):
    data = request.json
    resultado = productos.update_one({"_id": ObjectId(id)}, {"$set": data})
    if resultado.matched_count == 1:
        return jsonify({"mensaje": "Producto actualizado correctamente"}), 200
    else:
        return jsonify({"mensaje": "Producto no encontrado"}), 404

# Eliminar un producto
@productos_bp.route('/<id>', methods=['DELETE'])
def eliminar_producto(id):
    resultado = productos.delete_one({"_id": ObjectId(id)})
    if resultado.deleted_count == 1:
        return jsonify({"mensaje": "Producto eliminado correctamente"}), 200
    else:
        return jsonify({"mensaje": "Producto no encontrado"}), 404
