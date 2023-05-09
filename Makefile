all:
	docker-compose up

nest:
	npm run start:dev

migrate:
	npx prisma migrate dev --name init

seed:
	npm run seed

clean:
	sudo docker-compose down -v --rmi all --remove-orphans

fclean: clean
	docker system prune --volumes --all --force
	docker network prune --force
	docker volume prune --force

ffclean: fclean
	rm -rf db

re: fclean all
