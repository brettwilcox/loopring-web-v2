import styled from "@emotion/styled";
import { MenuItem, MenuItemProps } from "@material-ui/core";


export const TabItemPlus = styled<any>(MenuItem)`
  && {
    &.Mui-focusVisible {
      background-color: transparent;
    }

    margin: 0;
    padding: 0 0 0 1.6rem;

    &:hover {
      background-color: transparent;
      border-left-color: transparent;
    }

    .MuiIconButton-root {
      svg {
        width: var(--header-menu-icon-size);
        height: var(--header-menu-icon-size);
        color: var(--color-text-secondary);
      }

      :hover {
        svg {
          color: var(--color-text-primary);
        }

        color: var(--color-text-primary);
      }
    }

  }
` as React.ElementType<MenuItemProps>;


