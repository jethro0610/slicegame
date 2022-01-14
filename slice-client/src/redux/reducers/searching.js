const initialState = false;

export const setSearching = (searching) => {
    return { type: 'SET_SEARCHING', searching };
}

export const searchingReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_SEARCHING':
            return action.searching;

        default:
            return state;
    }
}

