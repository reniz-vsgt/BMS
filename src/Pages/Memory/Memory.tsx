import React, { useEffect, useState } from 'react';
import { BluetoothDevice, IBleProps, RequestDeviceOptions } from './Memory.types';
import { Space, Typography, Button, Input, Modal, Form } from 'antd';
import { Layout } from 'antd';


const { Title } = Typography;
const { Content } = Layout;


const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    width: '100%',
    backgroundColor: 'white'
};


const Memory: React.FC<IBleProps> = ({
    readService,
    readChar,
    writeService,
    writeChar,
    speed,
    writeValue,
    message
}) => {

    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [characteristicValue, setCharacteristicValue] = useState<any>('');
    const [finalData, setFinalData] = useState<string[][]>([[]]);
    const [intervalId, setIntervalId] = useState<NodeJS.Timer>()
    const [name, setName] = useState<string>("")
    const [driver, setDriver] = useState<string>("")
    const [isModalOpen, setIsModalOpen] = useState(false);




    useEffect(() => {
        if (characteristicValue) {
            setFinalData(finalData=> [...finalData, characteristicValue])
        }

    }, [characteristicValue]);

    const connectToDevice = async () => {
        try {
            const options: RequestDeviceOptions = {
                acceptAllDevices: true,
                optionalServices: [readService, writeService],
            };
            const device = await (navigator as any).bluetooth.requestDevice(options);

            setDevice(device);
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
            const service = await device.gatt?.connect();
            if (service) {
                const Service = await service.getPrimaryService(writeService);
                const characteristic: any = await Service.getCharacteristic(writeChar);
                await characteristic?.writeValue(new TextEncoder().encode(newValue));

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
            const service = await device.gatt?.connect();
            if (service) {
                // await writeCharacteristic(writeValue)
                const Service = await service.getPrimaryService(readService);
                const characteristic = await Service.getCharacteristic(readChar);
                try {
                    characteristic.startNotifications().then((val) => {
                        const data = new Uint8Array(val.value?.buffer || new ArrayBuffer(0));
                        var string = new TextDecoder().decode(data);
                        const arr = string.split(',');
                        setCharacteristicValue(arr);
                    })
                }
                catch (error) {
                    alert("Device disconnected")
                    console.error('Failed to read data:', error);
                }
            }

        } catch (error) {
            console.error('Failed to read characteristic:', error);
            alert("Device disconnected")
        }
    };

    const download = (data: string[][], fileName: string) => {
        let csvContent = "data:text/csv;charset=utf-8," + ["Data Provided by Thermoniks"] + "\n" + ["Device : " + device?.name, "Company Name : " + name, "Driver Name : " + driver] + "\n" + ["Date", "Time", "Battery Voltage (V)", "Battery Current (Amps)", "Battery Temprature 1 (C)", "Battery Temprature 2 (C)", "Counter"] + data.join("\n");
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
        clearInterval(intervalId)
        setFinalData(([[]]));
        const newData = finalData.map((e) => {
            e[0] = unixToTimestamp(e[0]);
            e.pop();
            e.join(",")
            return e
        })
        download(newData, "sensor_data.csv")

    }

    const getData = async () => {
        const intervalId = setInterval(async () => {
            await writeCharacteristic(writeValue);
            readCharacteristic()
        }, 1000)
        setIntervalId(intervalId)
    }

    const handleCancel = () => {
        setIsModalOpen(false);
    };

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
                    </Space>
                    {device && <p>Connected to device: {device.name}</p>}
                    {characteristicValue && characteristicValue.length > 0 &&
                        <>
                            <Title level={3}> Date Time : {unixToTimestamp(characteristicValue[0])}  </Title>
                            <Title level={3}> Battery Voltage : {characteristicValue[1]} V </Title>
                            <Title level={3}> Battery Current : {characteristicValue[2]} Amp </Title>
                            <Title level={3}> Battery Temprature 1 : {characteristicValue[3]} °C </Title>
                            <Title level={3}> Battery Temprature 2 : {characteristicValue[4]} °C </Title>
                            <Title level={3}> Counter : {characteristicValue[5]} </Title>
                        </>
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
                    <Form.Item>
                        <Button type="primary" onClick={handleCancel}>Submit</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>

    );
};

export default Memory;


