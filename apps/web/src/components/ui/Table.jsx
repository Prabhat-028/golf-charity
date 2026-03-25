export function Table({ className = "", children, ...props }) {
    return (
        <div className="w-full overflow-auto">
            <table
                className={`w-full caption-bottom text-sm ${className}`}
                {...props}
            >
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ className = "", children, ...props }) {
    return (
        <thead className={`bg-gray-50 ${className}`} {...props}>
            {children}
        </thead>
    );
}

export function TableBody({ className = "", children, ...props }) {
    return (
        <tbody className={`divide-y divide-gray-100 ${className}`} {...props}>
            {children}
        </tbody>
    );
}

export function TableRow({ className = "", children, ...props }) {
    return (
        <tr
            className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50 ${className}`}
            {...props}
        >
            {children}
        </tr>
    );
}

export function TableHead({ className = "", children, ...props }) {
    return (
        <th
            className={`h-12 px-4 text-left align-middle font-medium text-gray-500 ${className}`}
            {...props}
        >
            {children}
        </th>
    );
}

export function TableCell({ className = "", children, ...props }) {
    return (
        <td className={`p-4 align-middle ${className}`} {...props}>
            {children}
        </td>
    );
}
