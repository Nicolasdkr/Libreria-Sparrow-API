# routes/proveedores.py
from flask import Blueprint, jsonify, request
from bson import ObjectId
from db.connection import db

proveedores_bp = Blueprint('proveedores', __name__)
proveedores = db.proveedores

# Listar todos los proveedores
@proveedores_bp.route('/', methods=['GET'])
def listar_proveedores():
    resultado = []
    for prov in proveedores.find():
        prov['_id'] = str(prov['_id'])
        prov['productos'] = [str(p) for p in prov.get('productos', [])]
        resultado.append(prov)
    return jsonify(resultado)

# Crear un nuevo proveedor
@proveedores_bp.route('/', methods=['POST'])
def crear_proveedor():
    data = request.json
    proveedores.insert_one(data)
    return jsonify({"mensaje": "Proveedor agregado correctamente"}), 201

# Actualizar un proveedor
@proveedores_bp.route('/<id>', methods=['PUT'])
def actualizar_proveedor(id):
    data = request.json
    resultado = proveedores.update_one({"_id": ObjectId(id)}, {"$set": data})
    if resultado.matched_count == 1:
        return jsonify({"mensaje": "Proveedor actualizado correctamente"}), 200
    else:
        return jsonify({"mensaje": "Proveedor no encontrado"}), 404

# Eliminar un proveedor
@proveedores_bp.route('/<id>', methods=['DELETE'])
def eliminar_proveedor(id):
    resultado = proveedores.delete_one({"_id": ObjectId(id)})
    if resultado.deleted_count == 1:
        return jsonify({"mensaje": "Proveedor eliminado correctamente"}), 200
    else:
        return jsonify({"mensaje": "Proveedor no encontrado"}), 404
