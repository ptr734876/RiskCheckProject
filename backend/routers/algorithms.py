from fastapi import APIRouter, HTTPException
from typing import Optional
from backend.models import AlgorithmStep, Algorithm

router = APIRouter(prefix="/algorithms", tags=["Algorithms"])

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

# Временное хранилище прогресса (подобно галочкам из доков)
user_progress = {} 

# выдает все доступные пользователю алгоритмы
# лезет в хранилище и ищет его прогресс по алгоритмам и ставит им галочки
@router.get("/")
async def get_algorithms(user_id: Optional[str] = None):
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
    
    return {"algorithms": result}

# при переходе на конкретный алгоритм выписывает его шаги
@router.get("/{algorithm_id}")
async def get_algorithm(algorithm_id: int, user_id: Optional[str] = None):
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
            return algo_copy
    
    raise HTTPException(status_code=404, detail="Algorithm not found")

# Переключение статуса каждого шага алгоритма
@router.patch("/{algorithm_id}/step/{step_number}")
async def toggle_step(algorithm_id: int, step_number: int, user_id: str):
    algo = next((a for a in ALGORITHMS if a["id"] == algorithm_id), None)
    if not algo:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    if step_number not in [s["step"] for s in algo["steps"]]:
        raise HTTPException(status_code=404, detail="Step not found")
    
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
    
    return {
        "message": f"Step {step_number} {status}",
        "completed_steps": len(completed),
        "total_steps": len(algo["steps"])
    }