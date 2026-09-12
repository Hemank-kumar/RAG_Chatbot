.PHONY: help up down restart logs backend-test eval

help:
	@echo "Multi-Agent RAG Platform Management Commands:"
	@echo "  make up           Start all Docker Compose services"
	@echo "  make down         Stop all Docker Compose services"
	@echo "  make restart      Restart services"
	@echo "  make logs         Tail container logs"
	@echo "  make backend-test Run backend pytest suite"
	@echo "  make eval         Run evaluation benchmark suite"

up:
	docker compose up --build -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

backend-test:
	cd backend && pytest tests/ -v

eval:
	cd backend && python -m app.evaluation.run
