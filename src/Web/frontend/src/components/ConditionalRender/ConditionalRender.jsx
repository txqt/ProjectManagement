import React from 'react';
import { usePermissions } from '~/hooks/usePermissions';
import { useParams } from 'react-router-dom';

const ConditionalRender = ({ children, permission, boardId = null, fallback = null, invert = false }) => {
  const { boardId: routeBoardId } = useParams();
  const { hasSystemPermission, hasBoardPermission, loading } = usePermissions();

  const effectiveBoardId = boardId ?? routeBoardId;

  // Nếu muốn tránh nháy khi đang load: trả fallback (hoặc null)
  if (loading && !effectiveBoardId) {
    return null;
  }

  const hasPermission = effectiveBoardId
    ? hasBoardPermission(effectiveBoardId, permission)
    : hasSystemPermission(permission);

  const shouldRender = invert ? !hasPermission : hasPermission;
  return shouldRender ? children : (fallback || null);
};


export default ConditionalRender;
