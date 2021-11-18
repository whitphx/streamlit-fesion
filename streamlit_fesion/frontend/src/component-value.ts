import { Streamlit } from "streamlit-component-lib";

export interface ComponentValue {
  pythonError: null | {
    message: string;
    stack: string;
  };
}

export function setComponentValue(componentValue: ComponentValue): void {
  return Streamlit.setComponentValue(componentValue);
}
