import * as React from 'react';
import { 
  DataGrid, 
  DataGridBody, 
  DataGridCell, 
  DataGridHeader, 
  DataGridHeaderCell, 
  DataGridRow, 
  FluentProvider, 
  Link, 
  OnSelectionChangeData, 
  TableCellLayout, 
  createTableColumn, 
  webLightTheme 
} from '@fluentui/react-components';

export interface IThemeViewProps {
  name?: string;
  columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
  records: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord[];
  openDatasetItem: (entityReference: ComponentFramework.EntityReference) => void;
  setSelectedRecordIds: (recordIds: string[]) => void;
}

export const ThemeView: React.FunctionComponent<IThemeViewProps> = (props) => {
 
  const createColumns = () => {
    return props.columns.map(column => createTableColumn<ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>({
      columnId: column.name,
      compare: (a, b) => {
        return a.getFormattedValue(column.name).localeCompare(b.getFormattedValue(column.name));
      },
      renderHeaderCell: () => {
        return (<DataGridHeaderCell style={{minWidth: column.visualSizeFactor}}>{column.displayName}</DataGridHeaderCell>)
      },
      renderCell: (item) => {
        if (column.name == "pwuser_name") {
          return (
            <DataGridCell style={{minWidth: column.visualSizeFactor}}>  
              <TableCellLayout truncate>
                <Link as="a" onClick={props.openDatasetItem.bind(this, item.getNamedReference())} >
                  {item.getFormattedValue(column.name)}
                </Link>
              </TableCellLayout>
            </DataGridCell>
          )
        } else if (column.name == "pwuser_background" || column.name == "pwuser_backgroundhover" || column.name == "pwuser_backgroundpressed" || column.name == "pwuser_backgroundselected" 
          || column.name == "pwuser_foreground" || column.name == "pwuser_foregroundhover" || column.name == "pwuser_foregroundpressed" || column.name == "pwuser_foregroundselected") {
          return (
            <DataGridCell style={{minWidth: column.visualSizeFactor}}>  
              <TableCellLayout truncate>
                <div>
                  <span style={{height: 16, width: 16, marginRight: 8, verticalAlign: 'text-top', borderRadius: 3, borderStyle: 'solid', borderWidth: '1px', display: 'inline-block', backgroundColor: item.getFormattedValue(column.name) }} />
                  {item.getFormattedValue(column.name)}
                </div>
              </TableCellLayout>
            </DataGridCell>
          );
        } else {
          return (
            <DataGridCell style={{minWidth: column.visualSizeFactor}}>  
              <TableCellLayout truncate>
                {item.getFormattedValue(column.name)}
              </TableCellLayout>
            </DataGridCell>
          );
        }
      },
    }));
  };

  return (
    <>
      <FluentProvider theme={webLightTheme} style={{ overflowX: "auto" }}>
        <DataGrid
          items={props.records}
          columns={createColumns()}
          sortable
          selectionMode="multiselect"
          getRowId={(item: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => item.getRecordId()}
          focusMode="composite"
          onSelectionChange={(ev: any, data: OnSelectionChangeData) => { 
            props.setSelectedRecordIds(Array.from(data.selectedItems.values()) as string[]); 
          }}
        >
          <DataGridHeader style={{width: "fit-content"}}>
            <DataGridRow
              selectionCell={{
                checkboxIndicator: { "aria-label": "Select all rows" },
              }}
            >
              {({ renderHeaderCell }) => (
                renderHeaderCell()
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<ComponentFramework.PropertyHelper.DataSetApi.EntityRecord> style={{width: "fit-content"}}>
            {({ item, rowId }) => (
              <DataGridRow<ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>
                key={rowId}
                selectionCell={{
                  checkboxIndicator: { "aria-label": "Select row" },
                }}
                onDoubleClick={() => props.openDatasetItem(item.getNamedReference())}
              >
                {({ renderCell }) => (
                  renderCell(item)
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </FluentProvider>
    </>
  )
};
