import React from 'react';
import {createUseStyles} from 'react-jss';
import {FilesViewerPage} from './pages/FilesViewerPage';

const useStyles = createUseStyles({
    App: {
        width: '100%',
        height: '100%',
        padding: '10px',
    },
});

const App: React.FC = () => {
    const css = useStyles();

    return (
        <div className={css.App}>
            <FilesViewerPage />
        </div>
    );
};

export default App;
