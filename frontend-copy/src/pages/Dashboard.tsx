import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";

const Dashboard: React.FC = () => {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="w-64 bg-card p-4 flex flex-col">
                <h2 className="text-lg font-semibold mb-4">Chats</h2>
                <ul className="space-y-2 flex-1">
                    <li className="text-muted">Chat 1 - today</li>
                    <li className="text-muted">Chat 2 - 25/05/02</li>
                </ul>
                <Button>New Chat</Button>
            </div>
            {/* Main */}
            <div className="flex-1 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to MPP Optimizer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted">
                            Hi! I’m your personal SQL guru. Send me your SQL query...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
