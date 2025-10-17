import { usePermissions } from '~/hooks/usePermissions';
import { useParams } from 'react-router-dom';

export const usePermissionAttribute = (permission, boardId = null) => {
  const { boardId: routeBoardId } = useParams();
  const { hasSystemPermission, hasBoardPermission } = usePermissions();

  const effectiveBoardId = boardId ?? routeBoardId;

  const hasPermission = effectiveBoardId
    ? hasBoardPermission(effectiveBoardId, permission)
    : hasSystemPermission(permission);

  return hasPermission ? {} : { 'data-no-dnd': 'true' };
};
