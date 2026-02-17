export default function Unauthorized() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900">403</h1>
                <p className="text-2xl font-semibold text-gray-700 mt-4">Access Denied</p>
                <p className="text-gray-600 mt-2">
                    You don't have permission to access this page.
                </p>
                <a
                    href="/"
                    className="mt-6 inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
