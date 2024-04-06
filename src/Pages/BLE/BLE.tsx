import React, { useEffect, useState } from 'react';
import { BluetoothDevice, IBleProps, RequestDeviceOptions } from './BLE.types';
import { Space, Typography, Button, Input, Modal, Form } from 'antd';
import { Layout } from 'antd';


const { Title } = Typography;
const { Content } = Layout;


const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    width: '100%',
    backgroundColor: 'white'
};


const BLE: React.FC<IBleProps> = ({
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
            setFinalData([...finalData, characteristicValue])
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


    const readCharacteristic = async () => {
        if (!device) {
            console.error('No device connected');
            alert('Please connect a device first');
            return;
        }
        try {
            const service = await device.gatt?.connect();
            if (service) {
                const Service = await service.getPrimaryService(readService);
                const characteristic = await Service.getCharacteristic(readChar);
                try {
                    const intervalId = setInterval(() => {
                        characteristic.startNotifications().then((val) => {
                            const data = new Uint8Array(val.value?.buffer || new ArrayBuffer(0));
                            var string = new TextDecoder().decode(data);
                            const arr = string.split(',');
                            setCharacteristicValue(arr);
                        })
                    }, speed)
                    setIntervalId(intervalId)
                }
                catch (error) {
                    stopTimer()
                    alert("Device disconnected")
                    console.error('Failed to read data:', error);
                }
            }

        } catch (error) {
            console.error('Failed to read characteristic:', error);
            alert("Device disconnected")
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
                alert('Value written Successfully!!!');
            }

        } catch (error) {
            console.error('Failed to write characteristic:', error);
            alert("Device disconnected")
        }
    };

    const download = (data: string[][], fileName: string) => {
        let csvContent = "data:text/csv;charset=utf-8," + ["Data Provided by Thermoniks"]+"\n"+["Device : " + device?.name, "Company Name : " + name, "Driver Name : " + driver] + "\n" + [ "Date", "Time", "Battery Voltage (V)", "Battery Current (Amps)", "Battery Temprature 1 (C)", "Battery Temprature 2 (C)", "Counter"] + data.join("\n");
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
        console.log(unix, "------------> unix");
        
        // var date = new Date(unix_timestamp * 1000);
        // var hours = date.getHours();
        // var minutes = "0" + date.getMinutes();
        // var seconds = "0" + date.getSeconds();
        // var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        // return formattedTime
        // const myUnixTimestamp = 1691622800; // start with a Unix timestamp

        const myDate = new Date(unix_timestamp * 1000); // convert timestamp to milliseconds and construct Date object

        console.log(myDate); // will print "Thu Aug 10 2023 01:13:20" followed by the local timezone on browser console
        return myDate.toLocaleString()

        } catch (error) {
            console.log("Error in unix to datetime", error);
            return ""
        }
        

    }


    const stopTimer = () => {
        clearInterval(intervalId)
        setFinalData(([[]]));
        const newData = finalData.map((e) => {
            e[0] = unixToTimestamp(e[0]);
            // e.shift();
            e.pop();
            e.join(",")
            return e
        })
        download(newData, "sensor_data.csv")

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
                        <Button size={'large'} onClick={() => setIsModalOpen(true)}>Enter Details</Button>
                        <Button size={'large'} onClick={connectToDevice}>Connect to Device</Button>
                        <Button size={'large'} onClick={() => writeCharacteristic(writeValue)}>Start Sensors</Button>
                        <Button size={'large'} onClick={readCharacteristic}>Start Reading</Button>
                        <Button size={'large'} onClick={stopTimer}>Stop Reading</Button>
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

export default BLE;


