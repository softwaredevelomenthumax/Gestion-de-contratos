// Card component - Backward compatibility wrapper
// Re-exports the new unified Card and CardSkeleton components
export { default as Card } from './Card/index.jsx';
export { CardSkeleton } from './Card/CardSkeleton.jsx';
/**
 * Card component - Backward compatibility wrapper
 * 
 * This file re-exports the new unified Card component from the Card folder.
 * The new implementation supports variants ('compact' and 'lawyer') and uses
 * modular subcomponents for better maintainability.
 * 
 * All badges now consistently use "Radicado" terminology.
 */

import CardComponent from './Card/index';
export { CardSkeleton as LawyerCardSkeleton } from './Card/CardSkeleton';

export default CardComponent;