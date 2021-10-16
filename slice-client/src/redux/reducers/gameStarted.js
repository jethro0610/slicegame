const initialState = false;

export const setStarted= (started) => {
    return { type: 'SET_STARTED', started };
}

export const gameStartedReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_STARTED':
            return action.started;

        default:
            return state;
    }
}

