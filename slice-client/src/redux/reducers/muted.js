const initialState = false;

export const setMuted = (muted) => {
    return { type: 'SET_MUTED', muted };
}

export const muteReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_MUTED':
            return action.muted;

        default:
            return state;
    }
}

