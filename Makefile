all:
	docker-compose up

nest:
	npx prisma migrate dev --name init
	npm run seed
	npm run start:dev

clean:
	sudo docker-compose down

dbclean:
	rm -rf db

fclean: clean
	docker-compose down

ffclean: clean
	docker system prune -af
	rm -rf db

re: fclean all
