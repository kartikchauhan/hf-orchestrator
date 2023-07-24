docker-compose -f generatedYamls/ca.yaml up -d ca.org1.example.com

sleep 2

docker-compose -f generatedYamls/orderer.yaml up -d orderer.example.com

sleep 2

docker-compose -f generatedYamls/peer.yaml up -d peer0.org1.example.com

sleep 2

docker-compose -f generatedYamls/couchdb.yaml up -d couchdb0