# routes/pedidos.py
from flask import Blueprint, jsonify, request
from bson import ObjectId
from db.connection import db
from collections import Counter

pedidos_bp = Blueprint('pedidos', __name__)
pedidos = db.pedidos

# Listar todos los pedidos
@pedidos_bp.route('/', methods=['GET'])
def listar_pedidos():
    resultado = []
    for pedido in pedidos.find():
        pedido['_id'] = str(pedido['_id'])
        pedido['cliente_id'] = str(pedido['cliente_id']) if 'cliente_id' in pedido else None
        for producto in pedido.get('productos', []):
            producto['producto_id'] = str(producto['producto_id']) if 'producto_id' in producto else None
        resultado.append(pedido)
    return jsonify(resultado)

# Crear un nuevo pedido
@pedidos_bp.route('/', methods=['POST'])
def crear_pedido():
    data = request.json
    pedidos.insert_one(data)
    return jsonify({"mensaje": "Pedido registrado correctamente"})

# Actualizar un pedido
@pedidos_bp.route('/<id>', methods=['PUT'])
def actualizar_pedido(id):
    data = request.json
    resultado = pedidos.update_one({"_id": ObjectId(id)}, {"$set": data})
    if resultado.matched_count == 1:
        return jsonify({"mensaje": "Pedido actualizado correctamente"}), 200
    else:
        return jsonify({"mensaje": "Pedido no encontrado"}), 404

# Eliminar un pedido
@pedidos_bp.route('/<id>', methods=['DELETE'])
def eliminar_pedido(id):
    resultado = pedidos.delete_one({"_id": ObjectId(id)})
    if resultado.deleted_count == 1:
        return jsonify({"mensaje": "Pedido eliminado correctamente"}), 200
    else:
        return jsonify({"mensaje": "Pedido no encontrado"}), 404

# Estadísticas: conteo y top 10 productos
@pedidos_bp.route('/estadisticas', methods=['GET'])
def estadisticas_pedidos():
    enviados = pedidos.count_documents({"estado_envio": "Enviado"})
    pendientes = pedidos.count_documents({"estado_envio": "Pendiente"})

    conteo = Counter()
    for pedido in pedidos.find():
        for producto in pedido.get("productos", []):
            conteo[producto["titulo"]] += producto.get("cantidad", 1)

    top_10 = conteo.most_common(10)

    return jsonify({
        "enviados": enviados,
        "pendientes": pendientes,
        "top_10": [{"titulo": titulo, "cantidad": cantidad} for titulo, cantidad in top_10]
    })
