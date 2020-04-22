#!/bin/bash

cd /home/jdb/work/Neuralia/projects/neuralium-wallet

rm -r ./release

echo "packaging linux..."
npm run electron:linux

echo "compressing linux..."
cd /home/jdb/work/Neuralia/projects/neuralium-wallet/release/linux-unpacked
tar -czf  ../neuralium.wallet-linux-trial-run.tar.gz ./
cd /home/jdb/work/Neuralia/projects/neuralium-wallet

echo "packaging mac..."
npm run package:mac

echo "packaging mac..."
zip -qq -r ./release/neuralium.wallet-macos-trial-run.zip ./release/mac/neuralium.wallet.app


echo "packaging windows..."
npm run package:windows

echo "packaging renaming windows zip..."
mv ./release/neuralium.wallet-windows.zip ./release/neuralium.wallet-windows-trial-run.zip

echo "done!"
