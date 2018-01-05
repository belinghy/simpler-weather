import { createStore } from "redux";

/* Just a reducer */
export const settings = (state = "unset", action) => {
  switch (action.type) {
    case "SET_SETTINGS":
      state = "set";
      return state;
    default:
      return state;
  }
};

let store = createStore(settings);

export default store;
