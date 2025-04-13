import { useState, useCallback } from 'react';
import { Entity } from '../types/referential';
import { Selection } from '../types/conversation';

interface UseSelectionProps {
  referentials: Entity[];
  onSelectionChange?: (items: Selection[]) => void;
}

export function useSelection({ referentials, onSelectionChange }: UseSelectionProps) {
  const [selectedItems, setSelectedItems] = useState<Selection[]>([]);

  // Toggle la sélection d'un champ
  const toggleFieldSelection = useCallback((entityId: string, fieldId: number) => {
    const existingFieldIndex = selectedItems.findIndex(
      selection => selection.type === 'field' && 
                  selection.entityId === entityId && 
                  selection.fieldIds?.includes(fieldId)
    );
    
    // Vérifier si un groupe contenant ce champ est déjà sélectionné
    const entity = referentials.find(e => e['entity-id'] === entityId);
    if (!entity) return;
    
    const field = entity.fields.find(f => f['id-field'] === fieldId);
    if (!field) return;
    
    const fieldGroupName = field['lib-group'];
      
    const groupSelectedIndex = selectedItems.findIndex(
      selection => selection.type === 'group' && 
                  selection.entityId === entityId && 
                  selection.groupName === fieldGroupName
    );
    
    // Si le groupe est déjà sélectionné, ne rien faire car le champ est déjà inclus
    if (groupSelectedIndex >= 0) {
      return;
    }
    
    // Si le champ est déjà sélectionné, désélectionner
    if (existingFieldIndex >= 0) {
      const newSelectedItems: Selection[] = [];
      setSelectedItems(newSelectedItems);
      if (onSelectionChange) onSelectionChange(newSelectedItems);
    } else {
      // Sinon, remplacer toute sélection actuelle par ce champ uniquement
      const newSelectedItems: Selection[] = [{
        type: 'field',
        entityId,
        fieldIds: [fieldId]
      }];
      setSelectedItems(newSelectedItems);
      if (onSelectionChange) onSelectionChange(newSelectedItems);
    }
  }, [selectedItems, referentials, onSelectionChange]);

  // Toggle la sélection d'un groupe
  const toggleGroupSelection = useCallback((entityId: string, groupName: string) => {
    const existingSelectionIndex = selectedItems.findIndex(
      selection => selection.type === 'group' && 
                  selection.entityId === entityId && 
                  selection.groupName === groupName
    );
    
    if (existingSelectionIndex >= 0) {
      // Si le groupe est déjà sélectionné, tout désélectionner
      const newSelectedItems: Selection[] = [];
      setSelectedItems(newSelectedItems);
      if (onSelectionChange) onSelectionChange(newSelectedItems);
    } else {
      // Si le groupe n'est pas sélectionné, remplacer toute sélection existante par ce groupe
      const newSelectedItems: Selection[] = [{
        type: 'group',
        entityId,
        groupName
      }];
      setSelectedItems(newSelectedItems);
      if (onSelectionChange) onSelectionChange(newSelectedItems);
    }
  }, [selectedItems, onSelectionChange]);

  // Vérifier si un champ est sélectionné
  const isFieldSelected = useCallback((entityId: string, fieldId: number): boolean => {
    // Un champ est sélectionné s'il est explicitement sélectionné
    // ou s'il fait partie d'un groupe sélectionné
    return selectedItems.some(
      selection => 
        (selection.type === 'field' && 
         selection.entityId === entityId && 
         selection.fieldIds?.includes(fieldId)) ||
        (selection.type === 'group' && 
         selection.entityId === entityId &&
         referentials.find(e => e['entity-id'] === entityId)?.fields
          .filter(f => f['lib-group'] === selection.groupName)
          .some(f => f['id-field'] === fieldId))
    );
  }, [selectedItems, referentials]);

  // Vérifier si un groupe est sélectionné
  const isGroupSelected = useCallback((entityId: string, groupName: string): boolean => {
    return selectedItems.some(
      selection => selection.type === 'group' && 
                  selection.entityId === entityId && 
                  selection.groupName === groupName
    );
  }, [selectedItems]);

  // Effacer la sélection
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    if (onSelectionChange) onSelectionChange([]);
  }, [onSelectionChange]);

  return {
    selectedItems,
    setSelectedItems,
    toggleFieldSelection,
    toggleGroupSelection,
    isFieldSelected,
    isGroupSelected,
    clearSelection
  };
}

export default useSelection;