import React, { useEffect, useState } from 'react';
import { BluetoothDevice, IBleProps, RequestDeviceOptions } from './BLE.types';
import { Space, Typography, Button } from 'antd';
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
    const [intervalId, setIntervalId] = useState<NodeJS.Timer>()

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
                    alert("Device disconnected")
                    console.error('Failed to read data:', error);
                }
            }

        } catch (error) {
            console.error('Failed to read characteristic:', error);
            alert("Device disconnected")
        }
    };

    const unixToTimestamp = (unix: string) => {
        try {
            let unix_timestamp = parseInt(unix);
            const myDate = new Date(unix_timestamp * 1000);
            return myDate.toLocaleString()
        } catch (error) {
            console.log("Error in unix to datetime", error);
            return ""
        }
    }


    useEffect(() => {
        if (device != null) {
            readCharacteristic()
        }
    }, [device]);


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

    const stopTimer = () => {
        clearInterval(intervalId)
    }

    return (
        <>

            <Layout>
                <Content style={contentStyle}>
                    <Title>{message}</Title>
                    <Space wrap={true} size="large">
                        <Button type="primary" size={'large'} onClick={connectToDevice}>Connect to Device</Button>
                        {device != null ? (
                            <Button type="primary" size={'large'} onClick={stopTimer}>Stop Reading</Button>
                        ) : null}
                    </Space>
                    {device && <p>Connected to device: {device.name}</p>}
                    {characteristicValue && characteristicValue.length > 0 &&
                        <>
                            <Title level={3}> Date Time : {unixToTimestamp(characteristicValue[0])}  </Title>
                            <Title level={3}> Battery Voltage : {characteristicValue[1]} V </Title>
                            <Title level={3}> Battery Current : {characteristicValue[2]} Amp </Title>
                            <Title level={3}> Battery Temprature 1 : {characteristicValue[3]} °F </Title>
                            <Title level={3}> Battery Temprature 2 : {characteristicValue[4]} °F </Title>
                            <Title level={3}> Counter : {characteristicValue[5]} </Title>
                        </>
                    }
                </Content>
            </Layout>

        </>

    );
};

export default BLE;


