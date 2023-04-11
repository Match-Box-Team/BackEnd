all:
	docker-compose up
	nest

nest:
	npx prisma migrate dev --name init
	npm run seed
	npm run start:dev

clean:
	sudo docker-compose down

dbclean: clean
	docker-compose down -v
	rm -rf db

fclean: clean
	docker-compose down -v

re: fclean all
