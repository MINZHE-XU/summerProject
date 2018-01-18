const spots = (state =[], action) => {
  switch (action.type) {
    case 'ADD_SPOT':
      return [
        ...state,
        {
          id: action.id,
          lat: action.lat,
          lng: action.lng
        }
      ]
      break;
    case 'DELETE_SPOT':
      const currentSpotToDelete = state
      const indexToDelete = currentSpotToDelete.findIndex(
        function(spot){
          return spot.id === action.id;
        }
      )
      return[...currentSpotToDelete.slice(0, indexToDelete), ...currentSpotToDelete.slice(indexToDelete + 1)]
      break;
    default:
      return state
  }
}

export default spots
