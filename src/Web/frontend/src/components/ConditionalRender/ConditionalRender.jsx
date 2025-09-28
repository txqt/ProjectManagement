import React from 'react';
import { usePermissions } from '~/hooks/usePermissions';
import { useParams } from 'react-router-dom';

const ConditionalRender = ({ 
  children, 
  permission, 
  boardId = null, 
  fallback = null,
  invert = false 
}) => {
  const { boardId: routeBoardId } = useParams();
  const { hasSystemPermission, hasBoardPermission } = usePermissions();

  const effectiveBoardId = boardId ?? routeBoardId;

  const hasPermission = effectiveBoardId
    ? hasBoardPermission(effectiveBoardId, permission)
    : hasSystemPermission(permission);

  const shouldRender = invert ? !hasPermission : hasPermission;

  if (shouldRender) {
    return children;
  }

  return fallback || null;
};

export default ConditionalRender;
