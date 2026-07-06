from typing import Optional

from flask import Blueprint, jsonify, request

router = Blueprint("algorithms", __name__, url_prefix="/algorithms")

ALGORITHMS = [
    {
        "id": 1,
        "title": "Оценка объекта",
        "description": "Пошаговый алгоритм оценки недвижимости",
        "steps": [
            {"step": 1, "title": "Сбор документов", "description": "Паспорт, выписка ЕГРН, техпаспорт"},
            {"step": 2, "title": "Анализ рынка", "description": "Сравнение с аналогичными объектами"},
            {"step": 3, "title": "Осмотр объекта", "description": "Выезд на место, фотофиксация"},
            {"step": 4, "title": "Расчет стоимости", "description": "С учетом всех факторов"}
        ]
    },
    {
        "id": 2,
        "title": "Подготовка к продаже",
        "description": "Что нужно сделать перед продажей",
        "steps": [
            {"step": 1, "title": "Юридическая проверка", "description": "Проверка обременений и долгов"},
            {"step": 2, "title": "Подготовка документов", "description": "Сбор всех необходимых бумаг"},
            {"step": 3, "title": "Оценка стоимости", "description": "Заказ профессиональной оценки"},
            {"step": 4, "title": "Подача объявления", "description": "Размещение на площадках"}
        ]
    }
]

# Временное хранилище прогресса выполнения шагов алгоритмов
user_progress = {}

# Вернуть алгоритмы с текущим прогрессом пользователя
@router.route("/", methods=["GET"])
def get_algorithms():
    user_id = request.args.get("user_id")
    result = []
    for algo in ALGORITHMS:
        algo_copy = algo.copy()

        # Добавляем прогресс пользователя
        if user_id and user_id in user_progress:
            completed = user_progress[user_id].get(algo["id"], set())
            for step in algo_copy["steps"]:
                step["is_completed"] = step["step"] in completed
            algo_copy["completed_steps"] = len(completed)
        else:
            algo_copy["completed_steps"] = 0

        algo_copy["total_steps"] = len(algo_copy["steps"])
        result.append(algo_copy)

    return jsonify({"algorithms": result})

# Вернуть конкретный алгоритм вместе с его шагами
@router.route("/<int:algorithm_id>", methods=["GET"])
def get_algorithm(algorithm_id: int):
    user_id = request.args.get("user_id")
    for algo in ALGORITHMS:
        if algo["id"] == algorithm_id:
            algo_copy = algo.copy()

            if user_id and user_id in user_progress:
                completed = user_progress[user_id].get(algorithm_id, set())
                for step in algo_copy["steps"]:
                    step["is_completed"] = step["step"] in completed
                algo_copy["completed_steps"] = len(completed)
            else:
                algo_copy["completed_steps"] = 0

            algo_copy["total_steps"] = len(algo_copy["steps"])
            return jsonify(algo_copy)

    return jsonify({"detail": "Algorithm not found"}), 404

# Переключить статус шага алгоритма
@router.route("/<int:algorithm_id>/step/<int:step_number>", methods=["PATCH"])
def toggle_step(algorithm_id: int, step_number: int):
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    algo = next((a for a in ALGORITHMS if a["id"] == algorithm_id), None)
    if not algo:
        return jsonify({"detail": "Algorithm not found"}), 404

    if step_number not in [s["step"] for s in algo["steps"]]:
        return jsonify({"detail": "Step not found"}), 404

    if user_id not in user_progress:
        user_progress[user_id] = {}

    if algorithm_id not in user_progress[user_id]:
        user_progress[user_id][algorithm_id] = set()

    completed = user_progress[user_id][algorithm_id]
    if step_number in completed:
        completed.remove(step_number)
        status = "uncompleted"
    else:
        completed.add(step_number)
        status = "completed"

    return jsonify({
        "message": f"Step {step_number} {status}",
        "completed_steps": len(completed),
        "total_steps": len(algo["steps"])
    })