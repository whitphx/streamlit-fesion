pkg/build:
	python scripts/release_check.py streamlit_fesion/__init__.py
	cd streamlit_fesion/frontend && npm run build
	poetry build

format:
	isort .
	black .
	flake8
