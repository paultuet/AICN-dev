/**
 * Formate une date ISO en format localisé
 * @param dateString Chaîne de date au format ISO
 * @returns Date formatée selon les paramètres de localisation
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formate une date ISO en format court (jour/mois/année)
 * @param dateString Chaîne de date au format ISO
 * @returns Date courte formatée
 */
export const formatShortDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};