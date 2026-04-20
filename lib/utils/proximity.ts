export function calculateNearestProperty(userLat: number, userLng: number, propertyList: any[]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  return propertyList.map(prop => {
    const dLat = toRad(prop.lat - userLat);
    const dLon = toRad(prop.lng - userLng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLat)) * Math.cos(toRad(prop.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { ...prop, distance: R * c };
  }).sort((a, b) => a.distance - b.distance)[0]; // Return the single closest property
}