# routes/productos.py
from flask import Blueprint, jsonify, request
from bson import ObjectId
from db.connection import db
from bson.objectid import ObjectId, InvalidId

productos_bp = Blueprint('productos', __name__)
productos = db.productos

# Listar todos los productos
@productos_bp.route('/', methods=['GET'])
def listar_productos():
    productos = []
    coleccion_productos = db.productos
    coleccion_proveedores = db.proveedores

    for producto in coleccion_productos.find():
        proveedor_id = producto.get("proveedor_id")
        proveedor_nombre = "Sin proveedor"

        if proveedor_id:
            try:
                proveedor = coleccion_proveedores.find_one({"_id": ObjectId(proveedor_id)})
                if proveedor:
                    proveedor_nombre = proveedor.get("nombre", "Desconocido")
            except (InvalidId, TypeError):
                proveedor_nombre = "ID inválido"

        productos.append({
            "_id": str(producto["_id"]),
            "titulo": producto["titulo"],
            "autor": producto["autor"],
            "descripcion": producto["descripcion"],
            "categoria": producto["categoria"],
            "precio": producto["precio"],
            "stock": producto["stock"],
            "estado": producto["estado"],
            "imagen": producto.get("imagen", ""),
            "proveedor_nombre": proveedor_nombre  # ← este campo lo mostrará el frontend
        })

    return jsonify(productos)

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
