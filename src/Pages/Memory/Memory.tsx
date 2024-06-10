import React, { useState } from 'react';
import { BluetoothDevice, BluetoothRemoteGATTCharacteristic, BluetoothRemoteGATTServer, IBleProps, RequestDeviceOptions } from './Memory.types';
import { Space, Typography, Button, Input, Modal, Form } from 'antd';
import { Layout } from 'antd';
import { hourglass } from 'ldrs'


hourglass.register()




const { Title } = Typography;
const { Content } = Layout;


const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    width: '100%',
    backgroundColor: 'white'
};


const Memory: React.FC<IBleProps> = ({
    readService: readServiceUUID,
    readChar: readCharUUID,
    writeService: writeServiceUUID,
    writeChar: writeCharUUID,
    speed,
    writeValue,
    message
}) => {

    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [finalData, setFinalData] = useState<string>("\n");
    const [loader, setLoader] = useState<boolean>(false)
    const [name, setName] = useState<string>("")
    const [driver, setDriver] = useState<string>("")
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [service, setService] = useState<BluetoothRemoteGATTServer | undefined>();

    const [writeChar, setWriteChar] = useState<BluetoothRemoteGATTCharacteristic>();

    const [readChar, setReadChar] = useState<BluetoothRemoteGATTCharacteristic>();

    const [command, setCommand] = useState<string>("");
    const [reniz, setReniz] = useState<string>("");

    // const [isComplete, setisComplete] = useState<boolean>(false);



    const connectToDevice = async () => {
        try {
            const options: RequestDeviceOptions = {
                filters: [
                    {
                        namePrefix: "MB"
                    }
                ],
                optionalServices: [readServiceUUID, writeServiceUUID, "dd8c1300-3ae2-5c42-b8be-96721cd710fe"],
            };
            const device = await (navigator as any).bluetooth.requestDevice(options);
            setDevice(device);

            const service = await device.gatt?.connect();
            setService(service);

            const readService = await service.getPrimaryService(readServiceUUID);
            const readChar = await readService.getCharacteristic(readCharUUID);
            setReadChar(readChar)

            const writeService = await service.getPrimaryService(writeServiceUUID);
            const writeChar = await writeService.getCharacteristic(writeCharUUID);
            setWriteChar(writeChar)

        } catch (error) {
            console.error('Failed to connect:', error);
        }
    };


    const writeCharacteristic = async (newValue: any) => {
        if (!device) {
            console.error('No device connected');
            alert("Please connect a device first")
            return;
        }
        try {
            if (service) {
                console.log("Trying to write value : ", newValue);

                await writeChar?.writeValue(new TextEncoder().encode(newValue));
                console.log("Value written successfully!!! : ", newValue);
            }

        } catch (error) {
            console.error('Failed to write characteristic:', error);
            alert("Device disconnected")
        }
    };



    const readCharacteristic = async () => {
        if (!device) {
            console.error('No device connected');
            alert('Please connect a device first');
            return;
        }
        try {
            if (service) {
                try {
                    await readChar?.startNotifications();
                    setLoader(true)
                    readChar?.addEventListener('characteristicvaluechanged', (event) => {
                        const val = (event.target as BluetoothRemoteGATTCharacteristic).value?.buffer;
                        if (val) {
                            const data = new TextDecoder().decode(val);
                            // if (data === "") {
                            //     setisComplete(true)
                            //     setLoader(false)
                            // }
                            console.log(data, "----------------> data");
                            setFinalData(finalData => finalData + data + "****")
                        }
                    });
                }
                catch (error) {
                    console.error('Failed to read data:', error);
                    alert("Device disconnected")
                }
            }

        } catch (error) {
            console.error('Failed to read characteristic:', error);
            alert("Device disconnected")
        }
    };

    const download = (data: string[][], fileName: string) => {
        let csvContent = "data:text/csv;charset=utf-8," + ["Data Provided by Thermoniks"] + "\n" + ["Device : " + device?.name, "Company Name : " + name, "Driver Name : " + driver] + "\n" + ["Date", "Time", "Battery Voltage (V)", "Battery Current (Amps)", "Battery Temprature 1 (C)", "Battery Temprature 2 (F)", "Counter"] + "\n" + data.join("\n");
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
    };

    const unixToTimestamp = (unix: string) => {
        try {
            let unix_timestamp = parseInt(unix);
            const myDate = new Date(unix_timestamp * 1000);
            return myDate.toLocaleString()
        } catch (error) {
            console.error("Error in unix to datetime", error);
            return ""
        }
    }

    const stopTimer = () => {
        setLoader(false)
        writeCharacteristic("00")
        const fdata = finalData.split("****")
        const newData = fdata.map((e) => {
            const newe = e.split(",")
            newe[0] = unixToTimestamp(newe[0]);
            // newe.pop();
            // newe.pop();
            newe.join(",")
            return newe
        })
        setFinalData("");

        download(newData, "sensor_data.csv")

    }

    const getData = async () => {
        await writeCharacteristic(writeValue);
        readCharacteristic()
    }

    const handleCancel = () => {
        setIsModalOpen(false);
    };



    const demo = async () => {
        console.log("input string : ", command);
        const commadArray = command.split(",")
        const uint8 = new Uint8Array(8);
        for (let index = 0; index < commadArray.length; index++) {
            uint8[index] = parseInt(commadArray[index]);
        }
        // const value = command
        const service = await device?.gatt?.connect();
        const writeService = await service?.getPrimaryService("dd8c1300-3ae2-5c42-b8be-96721cd710fe");
        const writeChar = await writeService?.getCharacteristic("dd8c1307-3ae2-5c42-b8be-96721cd710fe");
        console.log("Encoded Format : ", uint8);
        
        let stringToDisplay = ""
        await writeChar?.writeValue(uint8);
        const val = await writeChar?.readValue()
        const data = new Uint8Array(val?.buffer || new ArrayBuffer(0));
        
        for (let index = 0; index < data.length; index++) {
            stringToDisplay+= (data[index]);
        }

        console.log(stringToDisplay, "----------> stringToDisplay");

        // var string = data.toString;
        setReniz(stringToDisplay)
        console.log("Read data === ", stringToDisplay);
    }

    return (
        <>

            <Layout>
                <Content style={contentStyle}>
                    <Title>{message}</Title>
                    <Space wrap={true} size="large">
                        <Button type="primary" size={'large'} onClick={() => setIsModalOpen(true)}>Enter Details</Button>
                        <Button type="primary" size={'large'} onClick={connectToDevice}>Connect to Device</Button>
                        <Button type="primary" size={'large'} onClick={getData}>Start Reading</Button>
                        <Button type="primary" size={'large'} onClick={stopTimer}>Download File</Button>

                        <Button type="primary" size={'large'} onClick={demo}>Test</Button>

                    </Space>
                    {device && <p>Connected to device: {device.name}</p>}
                    <br /><br />

                    {loader ? (
                        <div>
                            <l-hourglass
                                size="40"
                                bg-opacity="0.1"
                                speed="1.75"
                                color="#1677FF"
                            ></l-hourglass>
                            <br />
                            <h2>Reading your data from device!!</h2>
                            <h3>Keep Calm ...</h3>
                        </div>
                    ) : null}
                    {
                        reniz && <p>Read data: {reniz}</p>
                    }
                </Content>
            </Layout>
            <Modal title="Enter Details" open={isModalOpen} footer={null} onCancel={handleCancel}>
                <Form>
                    <Form.Item label="Company Name">
                        <Input placeholder="Enter Company Name" onChange={(e) => setName(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="Driver Name">
                        <Input placeholder="Enter Driver Name" onChange={(e) => setDriver(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="Command">
                        <Input placeholder="Enter Command" onChange={(e) => setCommand(e.target.value)} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" onClick={handleCancel}>Submit</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>

    );
};

export default Memory;




