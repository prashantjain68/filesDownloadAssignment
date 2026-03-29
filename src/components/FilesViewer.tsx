import {FilesService} from '@/utils/FilesService';
import {FileRec} from '@/utils/interfaces';
import {ChangeEvent, useEffect, useRef, useState} from 'react';
import {createUseStyles} from 'react-jss';

const BORDER_COLOR_TOKEN = '1px solid rgb(239, 239, 239)';
const useStyles = createUseStyles({
    FilesViewer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        height: '100%',
        overflowY: 'scroll',
    },

    errorContainer: {
        backgroundColor: '#f1c9c9',
        height: '30px',
        border: '1px solid #f1b7b7',
        borderRadius: '3px',
        padding: '5px',
    },

    toolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
    },

    toolbarField: {
        display: 'flex',
        gap: '5px',
    },

    filesViewerTable: {
        width: '100%',
        border: BORDER_COLOR_TOKEN,
        borderCollapse: 'collapse',

        '& th': {
            textAlign: 'left',
            backgroundColor: '#dde0e4',
        },

        '& tr': {
            border: BORDER_COLOR_TOKEN,
            height: '35px',

            '& td': {
                padding: '5px',
            },
        },

        '& tr:hover': {
            backgroundColor: '#ddd',
        },
    },

    selectedRow: {
        backgroundColor: '#eeeaea',
    },

    downloadableIndicatorCell: {
        width: '20px',
        textAlign: 'right',
    },
    downloadableIndicator: {
        width: '10px',
        backgroundColor: 'green',
        height: '10px',
        borderRadius: '5px',
        padding: '0px',
    },
});

export const FilesViewer = () => {
    const css = useStyles();

    //all files received from the API call
    const [data, setData] = useState<FileRec[]>([]);

    //if API call failed, show error
    const [error, setError] = useState('');

    //selected file IDs
    const [selectedFileIds, setSelectedFileIds] = useState<Record<string, true>>({});

    //all files that are downloadable
    const [downloadableFiles, setDownloadableFiles] = useState<FileRec[]>([]);

    /*
        checkbox.intermediate cannot be set directly in the virtual DOM because "intermediate"
        is not an attribute of <input type="checkbox"/>. It is a property and react does not give us a
        way of setting a property via the virtual DOM. Hence we will do it via this useRef.
        Alternate: Create a new component called Checkbox and expose "intermediate" as a prop
        but internally it will do the same that is being done here ... ref + set intermediate property
    */
    const selectAllRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        /*
            fetch the data.
            set state for downloadableFiles
        */
        void FilesService.getFiles().then((apiResp) => {
            setError(apiResp.error ?? '');
            const _data: FileRec[] = apiResp?.data ?? [];
            appendFileIDs(_data);

            let _downloadableFiles: FileRec[] = [];

            _data.forEach((d) => {
                if (isFileDownloadable(d)) {
                    _downloadableFiles.push(d);
                }
            });

            setData(_data);
            setDownloadableFiles(_downloadableFiles);
        });
    }, []);

    /*
        Below calls are light weight and not a performance issue even if we do it on every render cycle.
        No need to store the below variables in the component state.
    */
    const filesSelectedCount = Object.keys(selectedFileIds).length;
    const areAllFilesSelected =
        filesSelectedCount > 0 && filesSelectedCount === downloadableFiles.length;
    const arePartialFilesSelected =
        filesSelectedCount > 0 && filesSelectedCount < downloadableFiles.length;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = arePartialFilesSelected;
            selectAllRef.current.checked = areAllFilesSelected;
        }
    }, [arePartialFilesSelected, areAllFilesSelected]);

    //can be optimized with useCallback
    const onDownloadBtnClick = () => {
        const selectedFilePaths: string[] = [];
        downloadableFiles.forEach((d) => {
            if (selectedFileIds[d.id as string]) {
                selectedFilePaths.push(d.id as string);
            }
        });

        alert(`
            The following files will be downloaded ...
            ${selectedFilePaths.join('\n\n')} 
        `);
    };

    return (
        <div className={css.FilesViewer} data-testid="dtiFilesViewer">
            {!!error && (
                <div className={css.errorContainer} role="alert" data-testid="dtiFilesViewer_error">
                    {error}
                </div>
            )}

            {/* page toolbar section*/}
            <div
                className={css.toolbar}
                role="toolbar"
                aria-label="File actions"
                data-testid="dtiFilesViewer_toolbar"
            >
                {/* Select All checkbox */}
                <span className={css.toolbarField}>
                    <input
                        data-testid="dtiFilesViewer_selectAllCheckbox"
                        id="selectAllCheckbox"
                        type="checkbox"
                        ref={selectAllRef}
                        aria-label={areAllFilesSelected ? 'Deselect all files' : 'Select all files'}
                        onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                            const _selectedFileIds: typeof selectedFileIds = {};
                            if (evt.target.checked) {
                                downloadableFiles.forEach((d) => {
                                    _selectedFileIds[d.id as string] = true;
                                });
                            }

                            setSelectedFileIds(_selectedFileIds);
                        }}
                    />
                    <label htmlFor="selectAllCheckbox">Selected {filesSelectedCount}</label>
                </span>

                {/* Download button */}
                <span className={css.toolbarField}>
                    <button
                        disabled={filesSelectedCount === 0}
                        onClick={onDownloadBtnClick}
                        data-testid="dtiFilesViewer_downloadAllBtn"
                    >
                        Download all
                    </button>
                </span>
            </div>

            {/* list of files*/}
            <table className={css.filesViewerTable} role="grid">
                <caption>
                    <h3>Files</h3>
                </caption>

                <thead>
                    <tr>
                        <th scope="col" aria-label="Select"></th>
                        <th scope="col">Name</th>
                        <th scope="col">Device</th>
                        <th scope="col">Path</th>
                        <th scope="col"></th>
                        <th scope="col">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d) => {
                        const fileId = d.id as string;

                        return (
                            <FileRow
                                key={fileId}
                                fileRec={d}
                                isSelected={!!selectedFileIds[fileId]}
                                onSelectionChange={(evt: ChangeEvent<HTMLInputElement>) => {
                                    const _selectedFileIds = {...selectedFileIds};
                                    if (evt.target.checked) {
                                        _selectedFileIds[fileId] = true;
                                    } else {
                                        delete _selectedFileIds[fileId];
                                    }
                                    setSelectedFileIds(_selectedFileIds);
                                }}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

//----------------------------------------------------
type FileRowProps = {
    fileRec: FileRec;
    isSelected: boolean;
    onSelectionChange: (evt: ChangeEvent<HTMLInputElement>) => void;
};

const FileRow = ({fileRec, isSelected, onSelectionChange}: FileRowProps) => {
    const css = useStyles();
    const fileId = fileRec.id as string;
    const isDownloadable = isFileDownloadable(fileRec);

    /*
        A react component can return a root TR element. The below doesn't have to be wrapped in 
        a TBODY/TABLE tag here in this component. 
    */
    return (
        <tr
            data-fileid={fileId}
            data-testid="dtiFilesViewer_fileRow"
            className={isSelected ? css.selectedRow : ''}
            aria-selected={isSelected}
            role="row"
        >
            <td>
                {isDownloadable && (
                    <input
                        data-testid="dtiFilesViewer_selectFileCheckbox"
                        type="checkbox"
                        checked={isSelected}
                        onChange={onSelectionChange}
                        aria-label={`Select ${fileRec.device} : ${fileRec.path}`}
                    />
                )}
            </td>
            <td>{fileRec.name}</td>
            <td>{fileRec.device}</td>
            <td>{fileRec.path}</td>
            <td className={css.downloadableIndicatorCell}>
                {isDownloadable && (
                    <div
                        className={css.downloadableIndicator}
                        data-testid="dtiFilesViewer_downloadableIndicator"
                        aria-hidden="true"
                    ></div>
                )}
            </td>
            <td>{capitalizeFirstChar(fileRec.status)}</td>
        </tr>
    );
};

//----------------------------------------------------

//exported for testing purpose only
export const isFileDownloadable = (fileRec: FileRec) => {
    return fileRec.status === 'available';
};

//exported for testing purpose only
export const capitalizeFirstChar = (str: string) => {
    if (!str) {
        return str;
    }

    const firstChar = str.charAt(0).toUpperCase();
    return firstChar + str.substring(1);
};

export const appendFileIDs = (data: FileRec[]) => {
    data.forEach((d) => {
        d.id = `${d.device}:${d.path}`;
        d.id = d.id.replaceAll('\\', '_');
    });
};
