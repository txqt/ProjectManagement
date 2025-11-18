import React from 'react';
import { useIsTemplateBoard } from '~/hooks/useIsTemplateBoard';

/**
 * HOC chuẩn: truyền isTemplate và set displayName
 * @param {React.ComponentType} Component - component gốc
 * @returns {React.ForwardRefExoticComponent} Wrapped component
 */
export const withTemplateGuard = (Component) => {
  const Wrapped = React.forwardRef((props, ref) => {
    const isTemplate = useIsTemplateBoard();

    return <Component {...props} ref={ref} isTemplate={isTemplate} />;
  });

  // Set displayName để Fast Refresh & DevTools nhận diện
  const name = Component.displayName || Component.name || 'Component';
  Wrapped.displayName = `withTemplateGuard(${name})`;

  return Wrapped;
};
