import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/Select";
import Card from "../components/Card";
import { CardHeader, CardTitle, CardContent } from "../components/Card";

const Databases: React.FC = () => {
    return (
        <div className="flex min-h-screen">
            <div className="w-64 bg-card p-4">
                <h2 className="text-lg font-semibold mb-4">Chats</h2>
            </div>
            <div className="flex-1 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Database Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Database Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                    <SelectItem value="greenplum">GreenPlum</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input placeholder="Host" />
                            <Input placeholder="Port" />
                            <Input placeholder="Database" />
                            <Input placeholder="User" />
                            <Input type="password" placeholder="Password" />
                            <div className="space-x-2">
                                <Button>Test Connection</Button>
                                <Button>Save</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Databases;
