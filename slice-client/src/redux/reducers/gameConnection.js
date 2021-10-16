const initialState = {
    hasConnection: false
}

export const setHasConnection = (hasConnection) => {
    return { type: 'SET_HAS_CONNECTION', payload:{hasConnection} };
}

export const gameConnectionReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_HAS_CONNECTION':
            return {
                hasConnection: action.payload.hasConnection
            }

        default:
            return state;
    }
}

