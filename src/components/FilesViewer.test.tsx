import {
    act,
    getAllByTestId,
    getByTestId,
    queryByTestId,
    render,
    RenderResult,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {appendFileIDs, capitalizeFirstChar, FilesViewer, isFileDownloadable} from './FilesViewer';
import {ApiResponse, FileRec} from '@/utils/interfaces';
import {FilesService} from '@/utils/FilesService';

const FAKE_ERROR = 'Fake API error for testing';
const DUMMY_FILE: FileRec = {
    name: 'smss.exe',
    device: 'Mario',
    path: '\\Device\\HarddiskVolume2\\Windows\\System32\\smss.exe',
    status: 'scheduled',
};
const oiriginalGetFiles = FilesService.getFiles;
const oiriginalWindowAlert = window.alert;

const getFilesForTesting = async () => {
    const apiResp = await FilesService.getFiles();
    const allFiles: FileRec[] = apiResp.data ?? [];
    appendFileIDs(allFiles);

    const downloadableFiles = allFiles.filter((d) => {
        return isFileDownloadable(d);
    });

    return {apiResp, allFiles, downloadableFiles};
};

const renderComponent = async (minFilesExpected = 1) => {
    let ret: RenderResult = undefined as unknown as RenderResult;

    await act(async () => {
        //have to use Promise.resolve(...) to satisfy eslint.
        //could have just done: renderResult = render(<ComponentToRender {...myProps} />
        //Promise.resolve(...) does not hurt.

        ret = await Promise.resolve(render(<FilesViewer />));
    });

    /*
        We avoid race conditions by using a waitFor.
        In FilesService.ts, we have a setTimeout of 500ms. The component does not render the rows for 500ms.
        This results in failing tests. We fix it by assuring that the data fetch was complete and rows were rendered.
    */
    if (minFilesExpected) {
        await waitFor(
            () => {
                expect(
                    getAllByTestId(document.body, 'dtiFilesViewer_selectFileCheckbox').length
                ).toBeGreaterThanOrEqual(minFilesExpected);
            },
            {timeout: 15 * 1000}
        );
    }

    return ret;
};

describe('FilesViewer', () => {
    beforeEach(() => {
        FilesService.getFiles = oiriginalGetFiles;
        window.alert = oiriginalWindowAlert;
    });

    it(`should render the root element.
        should start with a disabled DownloadFiles button.
        should start with a unchecked SelectAll checkbox.
        should not render the Error component on API success`, async () => {
        await renderComponent();
        expect(getByTestId(document.body, 'dtiFilesViewer')).toBeInTheDocument();

        //the selectAll checkbox
        const selectAllCheckbox = getByTestId(
            document.body,
            'dtiFilesViewer_selectAllCheckbox'
        ) as HTMLInputElement;

        //the DownloadFiles button
        const downloadFilesButton = getByTestId(
            document.body,
            'dtiFilesViewer_downloadAllBtn'
        ) as HTMLButtonElement;

        const errorEl = queryByTestId(document.body, 'dtiFilesViewer_error');

        expect(errorEl).toBeFalsy();
        expect(selectAllCheckbox.indeterminate).toBe(false);
        expect(downloadFilesButton).toBeDisabled();
    });

    it(`should render the error message component when the API throws an error.`, async () => {
        FilesService.getFiles = async (): Promise<ApiResponse> => {
            return {data: undefined, ok: false, error: FAKE_ERROR};
        };

        await renderComponent(0);
        const errorEl = getByTestId(document.body, 'dtiFilesViewer_error');
        expect(errorEl.textContent).toBe(FAKE_ERROR);
    });

    it(`should render one row per file record.
        should render one SelectFile checkbox per downloadable file.
        should render one status indicator per downloadable file.
    `, async () => {
        const {allFiles, downloadableFiles} = await getFilesForTesting();

        await renderComponent();
        expect(getAllByTestId(document.body, 'dtiFilesViewer_fileRow').length).toEqual(
            allFiles.length
        );

        expect(getAllByTestId(document.body, 'dtiFilesViewer_selectFileCheckbox').length).toEqual(
            downloadableFiles.length
        );

        expect(
            getAllByTestId(document.body, 'dtiFilesViewer_downloadableIndicator').length
        ).toEqual(downloadableFiles.length);
    });

    it('should not render a checkbox for files that are not downloadable', async () => {
        const {allFiles} = await getFilesForTesting();
        const nonDownloadableFiles = allFiles.filter((d) => {
            return !isFileDownloadable(d);
        });

        // ensure test data has non-downloadable files
        expect(nonDownloadableFiles.length).toBeGreaterThan(0);

        await renderComponent();

        nonDownloadableFiles.forEach((file) => {
            const trEl = document.querySelector(`[data-fileid="${file.id}"]`) as HTMLElement;
            expect(trEl).toBeTruthy();
            const selectFileCheckbox = queryByTestId(trEl, 'dtiFilesViewer_selectFileCheckbox');
            expect(selectFileCheckbox).toBeFalsy();
        });
    });

    it(`- Selecting a single file ...
        should put the SelectFile checkbox in a checked state.
        should put the SelectAll checkbox in an intermediate state.
        should enable the DownloadFiles button.
        - Deselecting that same single file ...
        should put the SelectFile checkbox in an unchecked state.
        should put the SelectAll checkbox in an unchecked state.
        should disable the DownloadFiles button.
    `, async () => {
        const {downloadableFiles} = await getFilesForTesting();

        await renderComponent();

        //the number of downloadable files should be greater then 1 for this test to work.
        //if not, fail this test
        expect(downloadableFiles.length).toBeGreaterThan(1);

        //get the first downloadable file and the associated TR
        const firstDownloadableFile = downloadableFiles[0];
        const trEl = document.querySelector(
            `[data-fileid="${firstDownloadableFile.id}"]`
        ) as HTMLElement;
        expect(trEl).toBeTruthy();

        //the checkbox related to the file
        const selectFileCheckbox = getByTestId(
            trEl,
            'dtiFilesViewer_selectFileCheckbox'
        ) as HTMLInputElement;

        //the selectAll checkbox
        const selectAllCheckbox = getByTestId(
            document.body,
            'dtiFilesViewer_selectAllCheckbox'
        ) as HTMLInputElement;

        //the DownloadFiles button
        const downloadFilesButton = getByTestId(
            document.body,
            'dtiFilesViewer_downloadAllBtn'
        ) as HTMLButtonElement;

        // ------------ select the file ----------------

        //use act() to let the state change, update the DOM and useEffects to run
        await act(async () => {
            await userEvent.click(selectFileCheckbox);
        });

        expect(selectFileCheckbox.checked).toBe(true);
        expect(selectAllCheckbox.indeterminate).toBe(true);
        expect(downloadFilesButton).toBeEnabled();

        // ------------ deselect the same file ----------------
        await act(async () => {
            await userEvent.click(selectFileCheckbox);
        });

        expect(selectFileCheckbox.checked).toBe(false);
        expect(selectAllCheckbox.indeterminate).toBe(false);
        expect(selectAllCheckbox.checked).toBe(false);
        expect(downloadFilesButton).toBeDisabled();
    });

    it(`- Selecting all the files individually ...
        should put the SelectAll files checkbox in a checked state.
        should enable the DownloadFiles button.
        - Deselecting all the files individually ...
        should put the SelectAll files checkbox in an unchecked state.
        should disable the DownloadFiles button.
    `, async () => {
        await renderComponent();

        //the selectAll checkbox
        const selectAllCheckbox = getByTestId(
            document.body,
            'dtiFilesViewer_selectAllCheckbox'
        ) as HTMLInputElement;

        const selectFileCheckboxes = getAllByTestId(
            document.body,
            'dtiFilesViewer_selectFileCheckbox'
        ) as HTMLInputElement[];

        const downloadFilesButton = getByTestId(
            document.body,
            'dtiFilesViewer_downloadAllBtn'
        ) as HTMLButtonElement;

        // ---------- select all the files individually ----------
        for await (let selectFileCheckbox of selectFileCheckboxes) {
            await act(async () => {
                await userEvent.click(selectFileCheckbox);
            });
            expect(selectFileCheckbox.checked).toBe(true);
        }

        expect(selectAllCheckbox.checked).toBe(true);
        expect(downloadFilesButton).toBeEnabled();

        // ---------- deselect all the files individually ----------
        for await (let selectFileCheckbox of selectFileCheckboxes) {
            await act(async () => {
                await userEvent.click(selectFileCheckbox);
            });
            expect(selectFileCheckbox.checked).toBe(false);
        }

        expect(selectAllCheckbox.checked).toBe(false);
        expect(downloadFilesButton).toBeDisabled();
    });

    it(`- Selecting the SelectAll files checkbox ...
        should put all the SelectFile checkbox in a checked state.
        should enable the DownloadFiles button.
        - Deselecting the SelectAll files checkbox ...
        should put all the SelectFile checkbox in an unchecked state.
        should disable the DownloadFiles button.
    `, async () => {
        await renderComponent();

        const downloadFilesButton = getByTestId(
            document.body,
            'dtiFilesViewer_downloadAllBtn'
        ) as HTMLButtonElement;

        const selectAllCheckbox = getByTestId(
            document.body,
            'dtiFilesViewer_selectAllCheckbox'
        ) as HTMLInputElement;

        //------- select the SelectAll files checkbox
        await act(async () => {
            await userEvent.click(selectAllCheckbox);
        });

        const selectFileCheckboxes = getAllByTestId(
            document.body,
            'dtiFilesViewer_selectFileCheckbox'
        ) as HTMLInputElement[];

        selectFileCheckboxes.forEach((selectFileCheckbox) => {
            expect(selectFileCheckbox.checked).toBe(true);
        });
        expect(downloadFilesButton).toBeEnabled();

        //------ deselect the SelectAll files checkbox
        await act(async () => {
            await userEvent.click(selectAllCheckbox);
        });

        selectFileCheckboxes.forEach((selectFileCheckbox) => {
            expect(selectFileCheckbox.checked).toBe(false);
        });
        expect(downloadFilesButton).toBeDisabled();
    });

    it(`Clicking the DownloadFiles button should invoke the window.alert() function.`, async () => {
        jest.spyOn(window, 'alert').mockImplementation(() => {});
        const {downloadableFiles} = await getFilesForTesting();
        expect(downloadableFiles.length).toBeGreaterThan(0);

        await renderComponent();

        //the selectAll checkbox
        const selectAllCheckbox = getByTestId(
            document.body,
            'dtiFilesViewer_selectAllCheckbox'
        ) as HTMLInputElement;

        await act(async () => {
            await userEvent.click(selectAllCheckbox);
        });

        const downloadFilesButton = getByTestId(
            document.body,
            'dtiFilesViewer_downloadAllBtn'
        ) as HTMLButtonElement;

        await act(async () => {
            await userEvent.click(downloadFilesButton);
        });
        expect(window.alert).toHaveBeenCalled();
    });

    //-------------------------------------------
    describe('isFileDownloadable()', () => {
        it(`Should return true when file.status === 'available'`, () => {
            const fileRec: FileRec = {...DUMMY_FILE, status: 'available'};
            expect(isFileDownloadable(fileRec)).toBe(true);
        });

        it(`Should return false when file.status !== 'available'`, () => {
            let fileRec: FileRec = {...DUMMY_FILE, status: 'scheduled'};
            expect(isFileDownloadable(fileRec)).toBe(false);

            fileRec.status = '';
            expect(isFileDownloadable(fileRec)).toBe(false);
        });
    });

    //-------------------------------------------
    describe('appendFileIDs()', () => {
        it('should set id as device:path with backslashes replaced by underscores', () => {
            const files: FileRec[] = [{...DUMMY_FILE}];
            appendFileIDs(files);
            const firstFile = files[0];
            expect(firstFile.id!.startsWith(firstFile.device)).toBe(true);
            expect(firstFile.id!.includes('\\')).toBe(false);
        });

        it('should set ids on all files in the array', () => {
            const files: FileRec[] = [
                {...DUMMY_FILE, device: 'Mario', path: '\\Device\\file1.exe'},
                {...DUMMY_FILE, device: 'Luigi', path: '\\Device\\file2.exe'},
            ];
            appendFileIDs(files);
            expect(files[0].id).toBe('Mario:_Device_file1.exe');
            expect(files[1].id).toBe('Luigi:_Device_file2.exe');
        });

        it('should not throw when given an empty array', () => {
            expect(() => appendFileIDs([])).not.toThrow();
        });
    });

    //-------------------------------------------
    describe('capitalizeFirstChar()', () => {
        it(`Should return "Foo" when the "foo" has to be capitalized`, () => {
            expect(capitalizeFirstChar('foo')).toBe('Foo');
        });

        it(`Should return "undefined" when "undefined" has to be capitalized`, () => {
            expect(capitalizeFirstChar(undefined as unknown as string)).toBe(undefined);
        });

        it(`Should return "Hello woRLD" when "hello woRLD" has to be capitalized`, () => {
            expect(capitalizeFirstChar('hello woRLD')).toBe('Hello woRLD');
        });

        it(`should return an empty string when given an empty string`, () => {
            expect(capitalizeFirstChar('')).toBe('');
        });

        it(`should return the string unchanged when the first character is already uppercase`, () => {
            expect(capitalizeFirstChar('Foo Bar')).toBe('Foo Bar');
        });
    });
});
