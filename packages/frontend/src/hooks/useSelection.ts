import { useState, useCallback, useMemo } from 'react';
import { Entity, EntityId, Selection, FieldSelection, GroupSelection } from '@/types';

interface UseSelectionProps {
  referentials: Entity[];
  onSelectionChange?: (items: Selection[]) => void;
}

interface UseSelectionResult {
  // État
  selectedItems: Selection[];
  
  // Actions
  setSelectedItems: (items: Selection[]) => void;
  toggleFieldSelection: (entityId: EntityId, fieldId: number | string, fieldName?: string) => void;
  toggleGroupSelection: (entityId: EntityId, groupName: string) => void;
  clearSelection: () => void;
  
  // Prédicats
  isFieldSelected: (entityId: EntityId, fieldId: number | string) => boolean;
  isGroupSelected: (entityId: EntityId, groupName: string) => boolean;
  isSomethingSelected: boolean;
  
  // Utilitaires
  getSelectedFields: () => FieldSelection[];
  getSelectedGroups: () => GroupSelection[];
}

/**
 * Hook pour gérer la sélection des champs et groupes
 * Utilise une approche fonctionnelle avec des prédicats et des utilitaires de transformation
 */
export function useSelection({ referentials, onSelectionChange }: UseSelectionProps): UseSelectionResult {
  const [selectedItems, setSelectedItems] = useState<Selection[]>([]);

  // Setter amélioré avec notification du changement
  const updateSelectedItems = useCallback((items: Selection[]) => {
    setSelectedItems(items);
    if (onSelectionChange) onSelectionChange(items);
  }, [onSelectionChange]);

  // Toggle la sélection d'un champ
  const toggleFieldSelection = useCallback((entityId: EntityId, fieldId: number | string, fieldName?: string) => {
    // Vérifier si le champ est déjà sélectionné
    const existingFieldIndex = selectedItems.findIndex(
      selection => selection.type === 'field' && 
                 selection.entityId === entityId && 
                 selection.fieldIds?.some(id => 
                   id === fieldId || 
                   id === Number(fieldId) || 
                   String(id) === String(fieldId)
                 )
    );
    
    // Trouver l'entité pour vérifier le groupe du champ
    const entity = referentials.find(e => e['entity-id'] === entityId);
    if (!entity) return;
    
    // Trouver le champ pour obtenir son groupe
    const field = entity.fields.find(f => {
      if (!('id-field' in f)) return false;
      const idField = f['id-field'];
      return idField === fieldId || idField === Number(fieldId) || String(idField) === String(fieldId);
    });
    
    if (!field || !('lib-group' in field)) return;
    
    const fieldGroupName = field['lib-group'];
    
    // Vérifier si le groupe du champ est déjà sélectionné
    const groupSelectedIndex = selectedItems.findIndex(
      selection => selection.type === 'group' && 
                 selection.entityId === entityId && 
                 selection.groupName === fieldGroupName
    );
    
    // Si le groupe est déjà sélectionné, ne rien faire car le champ est déjà inclus
    if (groupSelectedIndex >= 0) {
      return;
    }
    
    // Si le champ est déjà sélectionné, le désélectionner
    if (existingFieldIndex >= 0) {
      updateSelectedItems([]);
    } else {
      // Sinon, sélectionner ce champ
      const newSelection: FieldSelection = {
        type: 'field',
        entityId,
        fieldIds: [typeof fieldId === 'number' ? fieldId : Number(fieldId) || fieldId],
        fieldName: fieldName || ('lib-fonc' in field ? field['lib-fonc'] : undefined)
      };
      
      updateSelectedItems([newSelection]);
    }
  }, [selectedItems, referentials, updateSelectedItems]);

  // Toggle la sélection d'un groupe
  const toggleGroupSelection = useCallback((entityId: EntityId, groupName: string) => {
    const existingIndex = selectedItems.findIndex(
      selection => selection.type === 'group' && 
                 selection.entityId === entityId && 
                 selection.groupName === groupName
    );
    
    if (existingIndex >= 0) {
      // Si déjà sélectionné, désélectionner
      updateSelectedItems([]);
    } else {
      // Sinon, sélectionner ce groupe
      const newSelection: GroupSelection = {
        type: 'group',
        entityId,
        groupName
      };
      
      updateSelectedItems([newSelection]);
    }
  }, [selectedItems, updateSelectedItems]);

  // Vérifier si un champ est sélectionné
  const isFieldSelected = useCallback((entityId: EntityId, fieldId: number | string): boolean => {
    // Un champ est sélectionné s'il est explicitement sélectionné
    // ou s'il fait partie d'un groupe sélectionné
    return selectedItems.some(
      selection => 
        (selection.type === 'field' && 
         selection.entityId === entityId && 
         selection.fieldIds?.some(id => 
           id === fieldId || 
           id === Number(fieldId) || 
           String(id) === String(fieldId)
         )) ||
        (selection.type === 'group' && 
         selection.entityId === entityId &&
         referentials.find(e => e['entity-id'] === entityId)?.fields
          .filter(f => 'lib-group' in f && f['lib-group'] === selection.groupName)
          .some(f => {
            if (!('id-field' in f)) return false;
            const idField = f['id-field'];
            return idField === fieldId || 
                   idField === Number(fieldId) || 
                   String(idField) === String(fieldId);
          }))
    );
  }, [selectedItems, referentials]);

  // Vérifier si un groupe est sélectionné
  const isGroupSelected = useCallback((entityId: EntityId, groupName: string): boolean => {
    return selectedItems.some(
      selection => selection.type === 'group' && 
                 selection.entityId === entityId && 
                 selection.groupName === groupName
    );
  }, [selectedItems]);

  // Effacer la sélection
  const clearSelection = useCallback(() => {
    updateSelectedItems([]);
  }, [updateSelectedItems]);

  // Utilitaires pour obtenir des vues filtrées des sélections
  const getSelectedFields = useCallback((): FieldSelection[] => {
    return selectedItems.filter((item): item is FieldSelection => item.type === 'field');
  }, [selectedItems]);

  const getSelectedGroups = useCallback((): GroupSelection[] => {
    return selectedItems.filter((item): item is GroupSelection => item.type === 'group');
  }, [selectedItems]);

  // Calcul dérivé pour savoir si quelque chose est sélectionné
  const isSomethingSelected = useMemo(() => selectedItems.length > 0, [selectedItems]);

  return {
    // État
    selectedItems,
    
    // Actions
    setSelectedItems: updateSelectedItems,
    toggleFieldSelection,
    toggleGroupSelection,
    clearSelection,
    
    // Prédicats
    isFieldSelected,
    isGroupSelected,
    isSomethingSelected,
    
    // Utilitaires
    getSelectedFields,
    getSelectedGroups
  };
}

export default useSelection;