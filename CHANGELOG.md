# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.5.6] - 2025-03-26

### Fix

- Fix the package manager and CI/CD pipeline.

## [0.5.5] - 2024-03-11

### Fix

- Fix the Python filter function executor not to use `runPythonAsync()` to avoid Python namespace pollution, [#19](https://github.com/whitphx/streamlit-fesion/pull/19).

## [0.5.4] - 2024-03-11

### Fix

- Fix the publish setting.
- Introduce Ruff, [#17](https://github.com/whitphx/streamlit-fesion/pull/17).
- Switch the bundler from Webpack to Vite and refactoring the worker code structure, [#13](https://github.com/whitphx/streamlit-fesion/pull/13).
- Internal package updates, [#12](https://github.com/whitphx/streamlit-fesion/pull/12).

## [0.5.3]

Skipped.

## [0.5.2]

Skipped.

## [0.5.1]

Skipped.

## [0.4.0] - 2022-10-21

### Fix

- Fix the filter function update so that it makes effect even before the worker is loaded, [#8](https://github.com/whitphx/streamlit-fesion/pull/8).

## [0.3.0] - 2022-10-21

### Fix

- Bundle the worker script inline so that it works on _stlite_, [#5](https://github.com/whitphx/streamlit-fesion/pull/5).

## [0.2.0] - 2022-10-21

### Change

- Run the image filter function on WebWorker, [#3](https://github.com/whitphx/streamlit-fesion/pull/3).
