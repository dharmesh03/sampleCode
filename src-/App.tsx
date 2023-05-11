import { Suspense } from 'react';
import { Loading } from 'shared';
import Routing from 'routes';
import 'assets/styles/App.css';
import { Toaster } from "react-hot-toast";

function App() {
    return (
        <Suspense fallback={Loading}>
            <Routing/>
            <Toaster/>
        </Suspense>
    );
}

export default App;
