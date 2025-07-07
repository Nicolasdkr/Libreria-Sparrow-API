# routes/clientes.py
from flask import Blueprint, jsonify, request
from bson import ObjectId
from db.connection import db

clientes_bp = Blueprint('clientes', __name__)
clientes = db.clientes

# Obtener todos los clientes
@clientes_bp.route('/', methods=['GET'])
def obtener_clientes():
    resultado = []
    for cliente in clientes.find():
        cliente['_id'] = str(cliente['_id'])  # Convertir ObjectId a string
        resultado.append(cliente)
    return jsonify(resultado)

# Obtener solo clientes con pedidos activos
@clientes_bp.route('/activos', methods=['GET'])
def obtener_clientes_activos():
    resultado = []
    for cliente in clientes.find({"pedido_activo": True}):
        cliente['_id'] = str(cliente['_id'])
        resultado.append(cliente)
    return jsonify(resultado)

# Agregar un nuevo cliente
@clientes_bp.route('/', methods=['POST'])
def agregar_cliente():
    data = request.json
    clientes.insert_one(data)
    return jsonify({"mensaje": "Cliente agregado correctamente"})

# Actualizar un cliente existente
@clientes_bp.route('/<id>', methods=['PUT'])
def actualizar_cliente(id):
    data = request.json
    resultado = clientes.update_one({"_id": ObjectId(id)}, {"$set": data})
    if resultado.matched_count == 1:
        return jsonify({"mensaje": "Cliente actualizado correctamente"}), 200
    else:
        return jsonify({"mensaje": "Cliente no encontrado"}), 404

# Eliminar un cliente
@clientes_bp.route('/<id>', methods=['DELETE'])
def eliminar_cliente(id):
    resultado = clientes.delete_one({"_id": ObjectId(id)})
    if resultado.deleted_count == 1:
        return jsonify({"mensaje": "Cliente eliminado correctamente"}), 200
    else:
        return jsonify({"mensaje": "Cliente no encontrado"}), 404
