-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "Syndic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
