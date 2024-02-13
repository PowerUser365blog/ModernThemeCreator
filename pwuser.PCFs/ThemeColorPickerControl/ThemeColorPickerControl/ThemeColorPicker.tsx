import * as React from 'react';
import { FluentProvider, Input, makeStyles, shorthands, webLightTheme } from '@fluentui/react-components';

export interface IThemeColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "row",
    ...shorthands.flex(1),
    "::before": {
      content: "var(--hexColor)",
      display: "block",
    },
  },
});

export const ThemeColorPicker: React.FunctionComponent<IThemeColorPickerProps> = (props: IThemeColorPickerProps) => {
  const styles = useStyles();

  return (
    <>
      <FluentProvider theme={webLightTheme} style={{width: "100%", "--hexColor": props.value} as React.CSSProperties}>
        <Input className={styles.root} style={{"--hexColor": props.value} as React.CSSProperties} type={"color" as any} value={props.value} onChange={(_, data) => { props.onChange(data.value) }} />
      </FluentProvider>
    </>
  );
}

