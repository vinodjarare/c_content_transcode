### Create Kafka topic:

- run docker compose in -it mode and then executes this commands 
cd  /opt/bitnami/kafka/bin

./kafka-topics.sh --create --topic transcode-start --bootstrap-server localhost:9092

./kafka-topics.sh --create --topic transcode-update --bootstrap-server localhost:9092

- List Kafka topics:

./kafka-topics.sh --list --bootstrap-server localhost:9092

- Get Topic details, partition counts etc.
./kafka-topics.sh --describe --bootstrap-server localhost:9092 --topic transcode-start

Alter the topic, change partition:
./kafka-topics.sh --alter --bootstrap-server localhost:9092 --topic transcode-start --partitions 3
./kafka-topics.sh --alter --bootstrap-server localhost:9092 --topic transcode-update  --partitions 3


